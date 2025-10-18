// new-attendee.js
const API_BASE = 'http://localhost:8080';
const $currentPage = $('body').data('page');

$(document).ready(function () {
    if ($currentPage === 'new-attendee') {
        loadAllSessions();
        $('#attendeeRegistrationForm').on('submit', registerAttendee);
    }
    else if ($currentPage === 'session-management') {
        loadAllSessions();
        loadAllAttendees();
        $('#listBtn').on('click', listRegistrations);
        $('#updateBtn').on('click', updateRegistration);
        $('#cancelBtn').on('click', cancelRegistration);
    }
    else if ($currentPage === 'edit-attendee') {
        loadAllAttendees();
        $('#saveBtn').on('click', updateAttendee);
    }
});


// Used in new-attendee and session-management
function loadAllSessions() {
    $.ajax({
        url: `${API_BASE}/session`,
        method: 'GET',
        dataType: 'json',
        success: function (sessions) {
            const $dropdown = $('#sessionDropdown');
            sessions.forEach(session => {
                const option = $("<option></option>").val(session._id).text(session.description);
                $dropdown.append(option);
            });
        },
        error: function () {
            console.error('Error loading sessions');
        }
    });
}

// Used in session-management and edit-attendee
function loadAllAttendees() {
    $.ajax({
        url: `${API_BASE}/attendee`,
        method: 'GET',
        dataType: 'json',
        success: function (attendees) {
            const $attendeeDropdown = $('#attendeeDropdown');
            $attendeeDropdown.find('option:not(:first)').remove();  // Remove old <option>s

            if(Array.isArray(attendees) && attendees.length > 0) {
                attendees.forEach(attendee => {
                    const option = $("<option></option>").val(attendee._id).text(`${attendee.displayname}`);
                    $attendeeDropdown.append(option);
                })
            }
        },
        error: function () {
            console.error('Error loading attendees');
        }
    });
}

// Used in new-attendee
function registerAttendee(e) {
    e.preventDefault();

    const firstName = $('#firstName').val();
    const lastName = $('#lastName').val();
    const displayName = $('#displayName').val();
    const sessionId = $('#sessionDropdown').val();

    // Creating attendee
    $.ajax({
        url: `${API_BASE}/attendee`,
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            firstname: firstName,
            lastname: lastName,
            displayname: displayName
        }),
        success: function (attendeeData) {
            const attendeeId = attendeeData.attendee_id;

            // Registering attendee for session
            $.ajax({
                url: `${API_BASE}/registration`,
                method: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({
                    attendee_id: attendeeId,
                    session_id: parseInt(sessionId)   // Jquery .val() returns string
                }),
                success: function (returnData) {
                    if (returnData.success) {
                        alert(`Success! Attende ${displayName} registered for session ${sessionId}!`);
                    }
                    else {
                        alert(`Error registering for session: ${returnData.error}`);
                    }
                },
                error: function () {
                    console.error('Error registering attendee');
                }
            });
        },
        error: function () {
            console.error("Error creating attendee");
        }
    });
}

// Used in session-management
function listRegistrations() {
    const sessionId = $('#sessionDropdown').val();
    const attendeeId = $('#attendeeDropdown').val();
    const $resultsArea = $('#resultsArea');

    // Both filled: Show if that attendee is in that session
    if (sessionId && attendeeId) {
        $.ajax({
            url: `${API_BASE}/registration?attendee_id=${attendeeId}&session_id=${sessionId}`,
            method: 'GET',
            dataType: 'json',
            success: function (registration) {
                if (registration.success) {
                    let html = `
                        <h2>Registration Details</h2>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Attendee ID</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Display Name</th>
                                    <th>Session ID</th>
                                    <th>Session</th>
                                    <th>Registration Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${registration.attendeeid}</td>
                                    <td>${registration.firstname}</td>
                                    <td>${registration.lastname}</td>
                                    <td>${registration.displayname}</td>
                                    <td>${registration.sessionid}</td>
                                    <td>${registration.session}</td>
                                    <td>${registration.registration_code}</td>
                                </tr>
                            </tbody>
                        </table>`;
                    $resultsArea.html(html);
                }
                else {
                    $resultsArea.html('<p>This attendee is not registered for this session</p>');
                }
            },
            error: function () {
                console.error('Error loading registration');
                $resultsArea.html('<p>Error loading registration</p>');
            }
        });
    }
    // Just session filled: Show all attendees in that session
    else if (sessionId) {
        $.ajax({
            url: `${API_BASE}/registration?session_id=${sessionId}`,
            type: 'GET',
            dataType: 'json',
            success: function (registrations) {
                if (Array.isArray(registrations) && registrations.length > 0) {
                    let html = `
                        <h2>All Registrations for this Session</h2>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Attendee ID</th>
                                    <th>Session ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${registrations.map(reg => `
                                    <tr>
                                        <td>${reg.attendee_id}</td>
                                        <td>${reg.session_id}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`;
                    $resultsArea.html(html);
                }
                else {
                    $resultsArea.html('<p>No registrations found for this session</p>');
                }
            },
            error: function () {
                console.error('Error listing registrations');
                $resultsArea.html('<p>Error loading registrations</p>');
            }
        });
    }
    // Just attendee filled: Show all sessions that attendee is registerd for
    else if (attendeeId) {
        $.ajax({
            url: `${API_BASE}/registration?attendee_id=${attendeeId}`,
            type: 'GET',
            dataType: 'json',
            success: function (registrations) {
                if (Array.isArray(registrations) && registrations.length > 0) {
                    let html = `
                        <h2>All Registrations for this Attendee</h2>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Attendee ID</th>
                                    <th>Session ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${registrations.map(reg => `
                                    <tr>
                                        <td>${reg.attendee_id}</td>
                                        <td>${reg.session_id}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`;
                    $resultsArea.html(html);
                } else {
                    $resultsArea.html('<p>This attendee has no registrations</p>');
                }
            },
            error: function () {
                console.error('Error listing registrations');
                $resultsArea.html('<p>Error loading registrations</p>');
            }
        });
    }
    // Neither filled: error
    else {
        alert('Please select at least a session or attendee');
    }
}

// Used in session-management
function updateRegistration() {
    const sessionId = $('#sessionDropdown').val();
    const attendeeId = $('#attendeeDropdown').val();

    // Both fields must be filled
    if (!sessionId || !attendeeId) {
        alert('Please select both an attendee and a session');
        return;
    }

    // Verify that registration exists
    $.ajax({
        url: `${API_BASE}/registration?attendee_id=${attendeeId}&session_id=${sessionId}`,
        type: 'GET',
        dataType: 'json',
        success: function (registration) {
            if (registration.success) { // if registration exists, proceed with update
                // Prompt user for new session
                const newSessionId = prompt('Enter the new session ID to move this attendee to:');
                if (!newSessionId) return;

                $.ajax({
                    url: `${API_BASE}/registration`,
                    method: 'PUT',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        attendee_id: parseInt(attendeeId),
                        old_session_id: parseInt(sessionId),
                        new_session_id: parseInt(newSessionId)
                    }),
                    success: function (returnData) {
                        if (returnData.success) {
                            alert(`Succces! Attendee ${attendeeId} move to session ${newSessionId}`);
                        }
                        else {
                            alert(`Error: ${returnData.error}`);
                        }
                    },
                    error: function () {
                        console.error('Error updating registration');
                    }
                });
            }
            else { // registration doesn't exist
                alert('This registration does not exist');
            }
        },
        error: function () {
            alert('Error verifying registration');
        }
    });
}

// Used in session-management
function cancelRegistration() {
    const sessionId = $('#sessionDropdown').val();
    const attendeeId = $('#attendeeDropdown').val();

    // Both fields must be filled
    if (!sessionId || !attendeeId) {
        alert('Please select both an attendee and a session');
        return;
    }

    // Verify that registration exists
    $.ajax({
        url: `${API_BASE}/registration?attendee_id=${attendeeId}&session_id=${sessionId}`,
        type: 'GET',
        dataType: 'json',
        success: function (registration) {
            if (registration.success) { // if registration exists, proceed with delete
                $.ajax({
                    url: `${API_BASE}/registration`,
                    method: 'DELETE',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        attendee_id: parseInt(attendeeId),
                        session_id: parseInt(sessionId),
                    }),
                    success: function (returnData){
                        if (returnData.success) {
                            alert('Registration cancelled successfully');
                            loadAllAttendees();
                        }
                        else {
                            alert(`Error cancelling registration: ${returnData.error}`);
                        }
                    },
                    error: function () {
                        console.error('Error cancelling registration');
                    }

                });
            }
            else {  // registration doesn't exist
                alert('This registration does not exist');
            }
        },
        error: function () {
            alert('Error verifying registration');
        }
    });
}

// Used in edit-attendee
function updateAttendee() {
    e.preventDefault();

    const attendeeId = $('#attendeeSelect').val();
    const firstName = $('#editFirstName').val();
    const lastName = $('#editLastName').val();
    const displayName = $('#editDisplayName').val();

    if (!attendeeId || !firstName || !lastName || !displayName){
        alert('Please fill all the fields');
    }

    $.ajax({
        url: `${API_BASE}/attendee`,
        method: 'PUT',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
           attendee_id: parseInt(attendeeId),
           firstName: firstName,
           lastName: lastName,
           displayName: displayName
        }),
        success: function (returnData) {
            if (returnData.success) {
                alert(`Success! Attendee information has been changed.`);
            }
            else {
                alert(`Error: ${returnData.error}`);
            }
        },
        error: function () {
            console.error('Error updating attendee');
        }
    });
}

















