import sqlite3 from 'sqlite3';
import express from 'express';

const app = express();
const PORT = 8080;

app.use(express.json());

let db = new sqlite3.Database('./cs415_p1.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    else {
        console.log("Connected to Database");
    }
});

// Training Sessions: (GET only)
app.get('/TrainingSession{/:session_id}', (request, response) => {  // NOTE: Can't use regular ? to specify optional paramter in this regexp version
    const session_id = request.params.session_id;

    if (session_id !== undefined) { // Return all attendees in the session
        db.all(
            'SELECT * FROM attendee JOIN registration ON attendee._id = registration.attendee_id WHERE registration.session_id = ?',
            [session_id],
            (err, rows) => {
            if (err) {
                console.error(err.message);
            }
            response.set('Content-Type', 'application/json');
            response.send(JSON.stringify(rows));
        });
    }
    else { // Return all sessions
        db.all('SELECT * FROM session', [], (err, rows) => {
            if (err) {
                console.error(err.message);
            }
            response.set('Content-Type', 'application/json');
            response.send(JSON.stringify(rows));
        });

    }
});

// Registrations: (GET, POST, PUT, DELETE)
app.get('/registration', (request, response) => {  // http://localhost:8080/registration?attendee_id=1&session_id=1
    const attendee_id = request.query.attendee_id;
    const session_id = request.query.session_id;

    if (attendee_id !== undefined && session_id !== undefined) {
        db.get(
            'SELECT ' +
            '   attendee.firstname ,' +
            '   true as success ,' +
            '   session.description as session ,' +
            '   attendee.displayname ,' +
            '   session._id as sessionid ,' +
            '   attendee._id as attendeeid ,' +
            '   attendee.lastname ' +
            'FROM attendee ' +
            'JOIN registration ON attendee._id = registration.attendee_id ' +
            'JOIN session ON registration.session_id = session._id ' +
            'WHERE attendee._id = ? AND session._id = ?',
            [attendee_id, session_id],
            (err, row) => {
               if (err) {
                   console.error(err.message);
               }
               else {
                   row.success = true;  //SQLite stores boolean values as ints. (1=true, 0=false)
                   response.set('Content-Type', 'application/json');
                   response.send(JSON.stringify(row));
               }
            }
        )
    }
    else if (attendee_id !== undefined && session_id === undefined) { // Return all of attendee's registrations
        db.all(
            'SELECT * FROM registration WHERE attendee_id = ?',
            [attendee_id],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                else {
                    response.set('Content-Type', 'application/json');
                    response.send(JSON.stringify(rows));
                }
            }
        );
    }
    else if (session_id !== undefined && attendee_id === undefined) { // Return all registrations in a session
        db.all(
            'SELECT * FROM registration WHERE session_id = ?',
            [session_id],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                else {
                    response.set('Content-Type', 'application/json');
                    response.send(JSON.stringify(rows));
                }
            }
        );
    }
    else { // Return all registrations
        db.all('SELECT * FROM registration', [], (err, rows) => {
            if (err) {
                console.error(err.message);
            }
            else {
                response.set('Content-Type', 'application/json');
                response.send(JSON.stringify(rows));
            }
        });
    }
});
app.post('/registration', (request, response) => {
    const attendee_id = request.body.attendee_id;  // Use body for data modification requests
    const session_id = request.body.session_id;

    if (attendee_id === undefined || session_id === undefined) {
        response.set('Content-Type', 'application/json');
        response.send(JSON.stringify({success: false, error: 'Need both attendee_id and session_id'}));
        return;
    }
    db.run(
        'INSERT INTO registration (attendee_id, session_id) VALUES (?, ?)',
        [attendee_id, session_id],
        function(err) {
            if (err) {
                response.set('Content-Type', 'application/json');
                response.send(JSON.stringify({success: false, error: err.message}));
            }
            else {
                response.set('Content-Type', 'application/json');
                response.send(JSON.stringify({
                    success: true,
                    attendee_id: attendee_id,
                    session_id: session_id
                }));
            }
    });
});
// app.put();
// app.delete();

// Attendees: (GET, POST, PUT)
// app.get();
// app.post();
// app.put();



// Start
app.listen(PORT, () => {
    console.log(`Registration Desk API server running on http://localhost:${PORT}`);
});

// db.close((err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     else {
//         console.log('Database closed.');
//     }
// });


