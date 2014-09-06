$(document).ready(
    function() {
        $('.attached-button-wrap').click(
            function() {
                $(this).children('.attached-button')[0].click();
            }
        );
        setupStep1();
    }
);

function setupClipboard(element) {
    element.click(function() {
        /* TODO: Add opening of modal with GAV to copy */
        alert("TODO: Open modal with link in input box")
    });
}

function setupButtonsForExporting() {
    $('#email-export').click(function(event) {
        event.preventDefault();

        window.location.href = "mailto:?subject=Project%20Dependency%20Status&body=" + buildMessageForExport();
    });

    function buildMessageForExport() {
        var message = "Hello world!\n\nWe've found updates to the following libraries used in your project:\n\n";
        $('.has-update-available').each( function() {
            var elem = $(this);
            message += elem.attr('data-artifact') + ": " +
                       elem.attr('data-version') + "--> " +
                       elem.attr('data-new-version') + "\n" +
                       elem.attr('data-group') + ":" +
                       elem.attr('data-artifact') + ":" +
                       elem.attr('data-new-version') + '"\n\n';
        });
        message += "# This list was generated via " + document.URL
        return encodeURIComponent(message);
    }
}

function showError(element, text) {
    element.text(text).addClass('error').removeClass('neutral').show()
}

function showProgress(element, text) {
    element.text(text).addClass('neutral').removeClass('error').show();
}

function setupStep1() {
    $('#search-box').submit(
        function(event) {
            event.preventDefault();

            var form = $(this);
            if (form.attr("running")) {
                return;
            }

            var status_box = form.find('.status');
            var github_info = form.find("input[name='github-info']");
            var validation_regex = /([a-z0-9-]+)\/([a-z0-9_.-]+)/ig;

            if (github_info.length == 0 || validation_regex.exec(github_info.val()) == null) {
                showError(status_box, 'Expected format: username/repo. ' +
                                      'Valid characters are alphanumerics, dashes and punctuations.');
                return;
            }

            form.attr("running", true);
            showProgress(status_box, 'Searching...');

            $.ajax(
                {
                    type: "POST",
                    dataType: 'json',
                    url:'/api/find-gradle-files/',
                    data: form.serialize(),
                    success: function (data) {
                        var container = $('#project-files-table');
                        container.find("tbody").remove();
                        status_box.text("").hide();

                        if (data['status'] != 'SUCCESS') {
                            showError(status_box, data['message']);
                            form.removeAttr("running");
                            return;
                        }

                        $(data['files']).each(
                            function(index, item) {
                                var new_element = $(
                                    '<tr>' +
                                    '    <td class="col-80">' +
                                    '        <a href="' + item['html_url'] + '" target="_blank">' + item['path'] + '</a>' +
                                    '    </td>' +
                                    '    <td class="col-20">' +
                                    '        <input name="selected" type="checkbox" checked value="' + item['html_url'] + '">' +
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
        function() {
            event.preventDefault();

            var form = $(this);
            if (form.attr("running")) {
                return;
            }

            var status_box = form.find('.status');
            var selected_files = form.find("input[type='checkbox']:checked");

            if (selected_files.length == 0) {
                showError(status_box, "No files selected. You'll need to select at least one of the above.");
                return;
            }

            form.attr("running", true);
            showProgress(status_box, 'Gathering dependencies (this might take a while)...');

            $.ajax(
                {
                    type: "POST",
                    dataType: 'json',
                    url:'/api/find-dependencies/',
                    data: form.serialize(),
                    success: function (data) {
                        var container = $('#project-deps-table');
                        container.find("tbody").remove();
                        status_box.text("").hide();

                        if (data['status'] != 'SUCCESS') {
                            showError(status_box, data['message']);
                            form.removeAttr("running");
                            return;
                        }

                        $(data['dependencies']).each(
                            function(index, item) {
                                var new_element = $(
                                    '<tr data-group="' + item['g']+ '" data-artifact="' + item['a'] + '" data-version="' + item['v'] + '">' +
                                    '    <td class="col-60">' +
                                    '        <span>' + item['a'] + '</span>' +
                                    '        <span class="dependency-meta">' + item['g'] +'</span>' +
                                    '        <span class="dependency-meta">' + item['v'] + '</span>' +
                                    '    </td>' +
                                    '    <td class="col-20" style="white-space: pre" id="progress-' + item['a'] + '">' +
                                    '        Checking...' +
                                    '    </td>' +
                                    '    <td class="col-20">' +
                                    '       <a href="#" class="red-button clipboard-button"">Copy to clipboard</a>' +
                                    '    </td>' +
                                    '</tr>'
                                );
                                container.append(new_element)
                            }
                        );

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

    container.find('#project-deps-table').find('tbody tr').each(
        function () {
            var this_elem = $(this);
            var group = this_elem.attr('data-group');
            var artifact = this_elem.attr('data-artifact');
            var version = this_elem.attr('data-version');
            var status_elem = this_elem.find('#progress-' + artifact);
            var button = this_elem.find("a.clipboard-button");

            var postdata = {
                'group': group,
                'artifact': artifact,
                'version': version
            };

            $.ajax(
                {
                    type: "POST",
                    dataType: 'json',
                    url: '/api/check-for-updates/',
                    data: postdata,
                    success: function (data) {
                        if (data['status'] == 'UPDATE_FOUND') {
                            this_elem.addClass("has-update-available");
                            this_elem.attr("data-new-version", data['new_version']);
                            status_elem.html(data['message'] + '<span class="dependency-meta">Update available</span>');
                        } else if (data['status'] == 'UP-TO-DATE') {
                            status_elem.html(data['message'] + '<span class="dependency-meta">Up to date</span>');
                        } else {
                            status_elem.html(data['message'] + '<span class="dependency-meta">:-(</span>');
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
