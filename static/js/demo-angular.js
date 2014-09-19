jQuery(document).ready(function() {
    jQuery('a[data-target]').click(function () {
        jQuery('#' + jQuery(this).attr('data-target')).slideToggle(400);
    });
});
(function() {
    var GITHUB_URL_REGEX = /^(?:(?:http(?:s)?:\/\/(?:www\.)?)?github\.com\/)?(([\w-]+)\/([\w\.-]+))$/i;
    var app = angular.module('demo', []);

    app.controller('MainController', function($scope, $rootScope){
        $rootScope.project_type = 'gradle';
        $rootScope.csrf_token = jQuery('input[name=csrfmiddlewaretoken]').val();

        $scope.showError = function(element, text) {
            element.html(text).addClass('error').removeClass('neutral').show();
        };

        $scope.showProgress = function(element, text) {
            element.html(text).addClass('neutral').removeClass('error').show();
        }
    });

    // Add them to the app
    app.controller('SearchController', SearchController);
    app.controller('FileListController', FileListController);
    app.controller('DependencyListController', DependencyListController);
    function SearchController($scope, $rootScope, $http) {
        $scope.running = false;
        $scope.updateProjectType = function() {
            $rootScope.project_type = $scope.selected_type;
        };

        $scope.triggerSearch = function($event) {
            // Silently exit if it's running or something else than a form submission or "button" triggering
            if ($scope.running || ($event.type === "keypress" && $event.keyCode !== 13)) {
                return;
            }
            $scope.running = true;

            var status_box = jQuery('#step-1-status');
            var github_info = $scope.github_info;
            var project_type = $rootScope.project_type;
            var token = $rootScope.csrf_token;

            var regex_matches = GITHUB_URL_REGEX.exec(github_info);
            if (!github_info || !regex_matches) {
                $scope.running = false;
                $scope.showError(status_box,
                                 'Invalid format, expected one of the following:<br><br>' +
                                 'Username/Repository<br>' +
                                 'https://www.github.com/Username/Repository<br><br>' +
                                 'Valid username/repository characters are alphanumerics, dashes and punctuations.');
                return;
            }


            $scope.showProgress(status_box, "Searching for " + regex_matches[1] + " on Github...");

            var postData = {
                "github-info": regex_matches[1],
                "project-type": project_type,
                "csrfmiddlewaretoken": token
            };

            $http({
                method: 'POST',
                url: '/api/find-project-files/',
                data: $.param(postData),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRFToken': token }
            }).success(function(data) {
                if (data.status === 'SUCCESS') {
                    $scope.$parent.$broadcast('ProjectFilesFound', { files: data.files });
                    jQuery('#step-1').fadeOut(400, function () {
                        $scope.running = false;
                        jQuery("#step-2").fadeIn(400);
                    });
                } else {
                    $scope.showError(status_box, data.message);
                    $scope.running = false;
                }
            }).error(function(data) {
                $scope.showError(status_box, data);
                $scope.running = false;
            });
        }
    }

    function FileListController($scope, $rootScope, $http) {
        $scope.running = false;
        $scope.files = [];

        // TODO: Remove listener on destroy?
        $scope.$on('ProjectFilesFound', function(event, data) {
            $scope.files = data.files;
        });

        // TODO: Fix checkbox toggler (see jQuery)
        $scope.toggleAllCheckboxes = function () {
        };

        $scope.fetchDependencies = function($event) {
            // Silently exit if it's running or something else than a form submission or "button" triggering
            if ($scope.running || ($event.type === "keypress" && $event.keyCode !== 13)) {
                return;
            }
            $scope.running = true;

            var status_box = jQuery('#step-2-status');
            var form = jQuery('#project-files-box');
            var selected_files = form.find('input[type="checkbox"]:checked');
            if (selected_files.length === 0) {
                $scope.showError(status_box, "No files selected. You'll need to select at least one of the above.");
                return;
            }

            $scope.showProgress(status_box, 'Gathering dependencies (this might take a while)...');
            $http({
                method: 'POST',
                url: '/api/find-dependencies/',
                data: form.serialize() + "&project-type=" + encodeURIComponent($rootScope.project_type),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRFToken': $rootScope.csrf_token }
            }).success(function(data) {
                if (data.status === 'SUCCESS') {
                    console.log(data);
                    $scope.$parent.$broadcast('DependenciesFound', { files: data.files });
                    jQuery('#step-2').fadeOut(400, function () {
                        $scope.running = false;
                        jQuery("#step-3").fadeIn(400);
                    });
                } else {
                    $scope.showError(status_box, data.message);
                    $scope.running = false;
                }
            }).error(function(data) {
                $scope.showError(status_box, data);
                $scope.running = false;
            });
            $scope.running = false;
        };
    }

    function DependencyListController($scope, $rootScope, $http) {
        $scope.files = [];

        // TODO: Remove listener on destroy?
        $scope.$on('DependenciesFound', function(event, data) {
            $scope.files = data.files;

            angular.forEach($scope.files, function(file, index) {
                angular.forEach(file.dependencies, function(dependency, dep_index) {
                    var postdata = {
                        'group': dependency.g,
                        'artifact': dependency.a,
                        'version': dependency.v,
                        'project-type': $rootScope.project_type
                    };
                    $http({
                        method: 'POST',
                        url: '/api/check-for-updates/',
                        data: $.param(postdata),
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRFToken': $rootScope.csrf_token }
                    }).success(function(data) {
                        var id = '#progress-' + (dependency.g + "_" + dependency.a + "_" + dependency.v).replace(/\./g, '_');
                        var element = jQuery(id);

                        console.log(data);

                        if (data.status === 'UPDATE_FOUND') {
                            element.addClass("has-update-available");
                            element.attr("data-new-version", data.new_version);
                            element.html(data.message + '<span class="dependency-meta">Update available</span>');
                        } else if (data.status === 'UP-TO-DATE') {
                            element.html(data.message + '<span class="dependency-meta">Up to date</span>');
                        } else {
                            element.html(data.message + '<span class="dependency-meta">:-(</span>');
                        }
                        $scope.running = false;
                    }).error(function(data) {
                        $scope.showError(jQuery("#step-3-status"), data);
                        $scope.running = false;
                    });

/*
            $.ajax(
                {
                    type: "POST",
                    dataType: 'json',
                    url: '/api/check-for-updates/',
                    data: postdata,
                    success: function (data) {
                        if (data.status === 'UPDATE_FOUND') {
                            this_elem.addClass("has-update-available");
                            this_elem.attr("data-new-version", data['new_version']);
                            status_elem.html(data.message + '<span class="dependency-meta">Update available</span>');
                        } else if (data.status === 'UP-TO-DATE') {
                            status_elem.html(data.message + '<span class="dependency-meta">Up to date</span>');
                        } else {
                            status_elem.html(data.message + '<span class="dependency-meta">:-(</span>');
                        }

                        button.attr('data-clipboard-text', data['gav_string']);
                        setupClipboard(button);
                    },
                    error: function (data) {
                        showError(status_box, data.responseText);
                    }
                }
            );*/

                });
            });
        });

        $scope.checkForUpdates = function($event) {
            // Silently exit if it's running or something else than a form submission or "button" triggering
            if ($scope.running) {
                return;
            }
            $scope.running = true;

            // TODO: Do logic here

            $scope.running = false;
        };
    }
})();