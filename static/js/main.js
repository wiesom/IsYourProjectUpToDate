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

        var message = buildMessageForExport();
        window.location.href = "mailto:?subject=Project%20Dependency%20Status&body=" + message;
    });

    function buildMessageForExport() {
        return "We've found updates to the following libraries in your project:";
    }
}

function setupStep1() {
    $('#search-box').submit(
        function(event) {
            event.preventDefault();

            var form = $(this);
            var github_info = form.find("input[name='github-info']");

            if (github_info.length == 0) {
                alert("Notify about empty value");
                return;
            }

            $.ajax(
                {
                    type: "POST",
                    dataType: 'json',
                    url:'/api/find-gradle-files/',
                    data: form.serialize(),
                    success: function (data) {
                        var container = $('#project-files-table');
                        container.children().remove();

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
                            }
                        );
                    },
                    error: function (data) {
                        console.log("[ERROR] data => " + data);
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
            var file_paths = form.find("input[type='hidden']");
            var selected_files = form.find("input[type='checkbox']");
            var csrf_token = form.find("input[name='csrfmiddlewaretoken']");

            if (file_paths.length == 0 || selected_files.length == 0 || csrf_token.length == 0) {
                alert("Notify about empty value");
                return;
            }

            $.ajax(
                {
                    type: "POST",
                    dataType: 'json',
                    url:'/api/find-dependencies/',
                    data: form.serialize(),
                    success: function (data) {
                        console.log(data);

                        var container = $('#project-deps-table');
                        container.children().remove();

                        $(data['dependencies']).each(
                            function(index, item) {
                                var new_element = $(
                                    '<tr data-group="' + item['g']+ '" data-artifact="' + item['a'] + '" data-version="' + item['v'] + '">' +
                                    '    <td class="col-60">' +
                                    '        <span>' + item['a'] + '</span>' +
                                    '        <span class="dependency-meta">' + item['g'] +'</span>' +
                                    '        <span class="dependency-meta">' + item['v'] + '</span>' +
                                    '    </td>' +
                                    '    <td class="col-20" id="progress-' + item['a'] + '">Checking...</td>' +
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
                                $("#step-3").fadeIn(400, setupStep3());
                            }
                        );
                    },
                    error: function (data) {
                        console.log("[ERROR] data => " + data);
                    }
                }
            );
        }
    );
}

function setupStep3() {
    setupButtonsForExporting();

    $('#project-deps-table').find('tr').each(
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
                        status_elem.text(data['message']);
                        button.attr('data-clipboard-text', data['gav_string']);
                        setupClipboard(button);
                    },
                    error: function (data) {
                        console.log("ERROR in check-for-updates call");
                        console.log(data);
                    }
                }
            );
        }
    );
}
