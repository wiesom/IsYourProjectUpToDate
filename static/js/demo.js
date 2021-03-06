/*jslint browser: true*/
/*global $, jQuery, ZeroClipboard, alert*/

var GITHUB_URL_REGEX = /^(?:(?:http(?:s)?:\/\/)?(?:www\.)?)github\.com\//i;
var USER_REPO_REGEX = /^([\w-]+)\/([\w.-]+)$/i;
var INVALID_LETTERS_REGEX = /[^\w\/\.-]/g;

function setupClipboard(element) {
    var client = new ZeroClipboard(element, { moviePath: "ZeroClipboard.swf", debug: false });
    client.on("load", function(client) {
        client.on("complete", function(client, args) {
            client.setText(args.text);
        });
    });
}

function setupButtonsForExporting() {
    var github_project = $('input[name="github-info"]').val().replace(GITHUB_URL_REGEX, "");

    $('#github-export').click(function(event) {
        event.preventDefault();

        var title = encodeURIComponent("Project Dependency Status");
        var body = buildMessageForExport(github_project, true);
        var url = 'https://github.com/' + github_project + '/issues/new?title=' + title + '&body=' + body;
        window.open(url, '_blank');
    });

    $('#email-export').click(function(event) {
        event.preventDefault();

        var subject = encodeURIComponent("Project Dependency Status for " + github_project);
        window.location.href = "mailto:?subject=" + subject + "&body=" + buildMessageForExport(github_project, false);
    });

    function buildMessageForExport(project, is_markdown) {
        var message = is_markdown ? "# " : "";
        message += "Hello world!\n\nWe've found updates to the following dependencies used in " +
                   (is_markdown? "**" : "") + project +
                   (is_markdown? "**" : "") + ":\n\n";

        var latest_path = '';

        $('.has-update-available').each( function() {
            var elem = $(this);

            if (elem.attr('data-path') !== latest_path) {
                latest_path = elem.attr('data-path');

                message += "File: " + latest_path + "\n\n";
            }

            message += (is_markdown? "**" : "    ") +
                       elem.attr('data-artifact') +
                       (is_markdown? "**" : "") + " " +
                       elem.attr('data-version') + "--> " +
                       elem.attr('data-new-version') + '\n' +
                       (is_markdown? "`" : "    ") + '"' +
                       elem.attr('data-group') + ":" +
                       elem.attr('data-artifact') + ":" +
                       elem.attr('data-new-version') + '"' +
                       (is_markdown? "`" : "") + '\n\n\n';
        });

        message += "*This list was generated via " + document.URL + "*";
        return encodeURIComponent(message);
    }
}

function showError(element, text) {
    element.html(text).removeClass('warning neutral').addClass('error').show();
}

function showWarning(element, text) {
    element.html(text).removeClass('progress error').addClass('warning').show();
}

function showProgress(element, text) {
    element.html(text).removeClass('error warning').addClass('neutral').show();
}

function setupStep1() {
    $('a[data-target]').click(function() {
        $('#' + $(this).attr('data-target')).slideToggle(400);
    });

    $('.pseudo-button').keydown(function(number) {
        if (number.keyCode === 13) {
            $(this).closest('form').submit();
        }
    });

    $('#search-box').submit(
        function(event) {
            event.preventDefault();

            var form = $(this);
            if (form.attr("running")) {
                return;
            }

            var status_box = form.find('.status');
            var github_info = form.find("input[name='github-info']");
            var github_info_value = github_info.val();
            var project_type = form.find("select[name='project-type']").val();
            var token = form.find('input[name="csrfmiddlewaretoken"]').val();

            /* Check for impossible errors */
            if (project_type === undefined){
                showError(status_box, "An impossible error has just occurred, so something is seriously broken!<br>");
                return;
            }

            /* Check for empty search field */
            if (github_info_value.length === 0){
                showWarning(status_box, 'You forgot to fill in the field below!<br>');
                return;
            }

            /* Strip away the github url from the search string*/
            github_info_value = github_info_value.replace(GITHUB_URL_REGEX, "");

            /* Search for invalid characters*/
            var found_invalid_letters = github_info_value.match(INVALID_LETTERS_REGEX);
            if (found_invalid_letters != null && found_invalid_letters.length > 0) {
                showError(status_box, 'Invalid characters: '+ $.unique(found_invalid_letters).join(" ") + ' <br>' +
                                      'Valid username/repository characters are alphanumerics, dashes and punctuations.');
                return;
            }

            /* Check that we have a username and a repo name separated by a "/" */
            var user_repo_match = USER_REPO_REGEX.exec(github_info_value);
            if (user_repo_match === null) {
                showError(status_box, 'Invalid format, expected one of the following:<br><br>' +
                                      '- &lt;username&gt;/&lt;repository&gt;<br>' +
                                      '- [[http[s]://]www.github.com/]&lt;username&gt;/&lt;repository&gt;<br><br>' +
                                      'Valid username/repository characters are alphanumerics, dashes and punctuations.');
                return;
            }

            var github_username = user_repo_match[1];
            var github_repository = user_repo_match[2];

            //TODO: Use GitHub api to verify the username and repository name
            form.attr("running", true);
            showProgress(status_box, 'Searching for ' + github_username + '/' + github_repository + ' on Github...');

            var postData = {
                "github-info": github_username + '/' + github_repository,
                "project-type": project_type,
                "csrfmiddlewaretoken": token
            };

            $.ajax(
                {
                    type: "POST",
                    dataType: 'json',
                    url:'/api/find-project-files/',
                    data: postData,
                    success: function (data) {
                        var container = $('#project-files-table');
                        container.find("tbody").remove();
                        status_box.text("").hide();

                        if (data.status !== 'SUCCESS') {
                            showError(status_box, data.message);
                            form.removeAttr("running");
                            return;
                        }

                        $(data['files']).each(
                            function(index, item) {
                                var value = item.html_url + '|' + item.path;
                                var new_element = $(
                                    '<tr class="data-row">' +
                                    '    <td class="col-80">' +
                                    '        <a href="' + item.html_url + '" target="_blank">' + item.path + '</a>' +
                                    '    </td>' +
                                    '    <td class="col-20">' +
                                    '        <input name="selected" type="checkbox" checked value="' + value + '">' +
                                    '    </td>' +
                                    '</tr>'
                                );
                                container.append(new_element)
                            }
                        );

                        // Last but not least
                        $('#step-1').fadeOut(
                            400, function() {
                                setupStep2();
                                $("#step-2").fadeIn(400);
                                form.removeAttr("running");
                            }
                        );
                    },
                    error: function (data) {
                        form.removeAttr("running");
                        showError(status_box, data.responseText);
                    }
                }
            );
        }
    );
}

function setupStep2() {
    $('#project-files-box').submit(
        function(event) {
            event.preventDefault();

            var form = $(this);
            if (form.attr("running")) {
                return;
            }

            var status_box = form.find('.status');
            var selected_files = form.find('input[type="checkbox"]:checked');
            var project_type = $('select[name="project-type"]').val();

            if (selected_files.length === 0) {
                showError(status_box, "No files selected. You'll need to select at least one of the above.");
                return;
            }

            if (project_type === undefined) {
                showError(status_box, "No project type selected.");
                return;
            }

            form.attr("running", true);
            showProgress(status_box, 'Gathering dependencies (this might take a while)...');
            $.ajax(
                {
                    type: "POST",
                    dataType: 'json',
                    url: '/api/find-dependencies/',
                    data: form.serialize() + "&project-type=" + encodeURIComponent(project_type),
                    success: function (data) {
                        var container = $('#project-deps-table-wrapper');
                        container.find("table").remove();
                        status_box.text("").hide();

                        if (data.status !== 'SUCCESS') {
                            showError(status_box, data.message);
                            form.removeAttr("running");
                            return;
                        }

                        $(data.results).each(function(index, file) {
                            if (file.dependencies.length === 0) {
                                return true;
                            }

                            var table = $(
                            '<table class="project-deps subtle-table">' +
                            '    <thead>' +
                            '        <tr>' +
                            '          <th class="col-60">Title</th>' +
                            '          <th class="col-20">Latest version</th>' +
                            '        </tr>' +
                            '    </thead>' +
                            '</table>');

                            var footer = $(
                            '<tfoot>' +
                            '    <tr>' +
                            '        <th colspan="3" style="text-align: left">' +
                            '            File: <a href="' + file.url + '">' + file.path + '</a>' +
                            '        </th>' +
                            '    </tr>' +
                            '</tfoot>');

                            $(file.dependencies).each(function(dep_index, dep) {
                                var element_id = "progress-" + dep.a.replace(/\./g, "_");
                                var table_row = $(
                                    '<tr class="data-row"' +
                                    '    data-path="' + file.path + '"' +
                                    '    data-group="' + dep.g + '" ' +
                                    '    data-artifact="' + dep.a + '" ' +
                                    '    data-version="' + dep.v + '"' +
                                    '>' +
                                    '    <td class="col-60">' +
                                    '        <span>' + dep.a + '</span>' +
                                    '        <span class="dependency-meta">' + dep.g + '</span>' +
                                    '        <span class="dependency-meta">' + dep.v + '</span>' +
                                    '    </td>' +
                                    '    <td class="col-20" style="white-space: pre" id="' + element_id + '">' +
                                    '        Checking...' +
                                    '    </td>' +
                                    '    <td class="col-20">' +
                                    '       <a href="#" class="red-button clipboard-button"">Copy to clipboard</a>' +
                                    '    </td>' +
                                    '</tr></tbody>'
                                );
                                table.append(table_row);
                            });
                            table.append(footer);
                            container.append(table);
                        });

                        // Last but not least
                        $('#step-2').fadeOut(
                            400, function() {
                                form.removeAttr("running");
                                $("#step-3").fadeIn(400, setupStep3());
                            }
                        );
                    },
                    error: function (data) {
                        form.removeAttr("running");
                        showError(status_box, data.responseText);
                    }
                }
            );
        }
    );
}

function setupStep3() {
    setupButtonsForExporting();

    var container = $('#step-3');
    var status_box = container.find('.status');
    var project_type = $('select[name="project-type"]').val();
    var token = container.find('input[name="csrfmiddlewaretoken"]').val();

    container.find('#project-deps-table-wrapper').find('tbody tr.data-row').each(
        function () {
            var this_elem = $(this);
            var group = this_elem.attr('data-group');
            var artifact = this_elem.attr('data-artifact');
            var version = this_elem.attr('data-version');
            var status_elem = this_elem.find('#progress-' + artifact.replace(/\./g, '_'));
            var button = this_elem.find("a.clipboard-button");

            var postdata = {
                'group': group,
                'artifact': artifact,
                'version': version,
                'project-type': project_type,
                'csrfmiddlewaretoken': token
            };

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
            );
        }
    );
}

$(document).ready(function() {
    $('.attached-button-wrap').click(function() {
        $(this).children('.attached-button')[0].click();
    });

    $('.file-toggler').click(function() {
        var checkbox = $(this);
        checkbox.closest('table').find('.data-row input[type="checkbox"]').prop('checked', checkbox.is(":checked"));
    });

    $('#project-files-table').on('click', '.data-row input[type="checkbox"]', function() {
        var checkbox = $(this);
        var toggler = checkbox.closest('table').find('.file-toggler');

        if ($('.data-row input[type="checkbox"]').size() == $('.data-row input[type="checkbox"]:checked').size()) {
            toggler.prop('checked', checkbox.is(':checked'));
        } else {
            toggler.prop('checked', false);
        }
    });

    setupStep1();
});
