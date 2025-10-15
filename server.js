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
app.get('/sessions{/:session_id}', (request, response) => {  // NOTE: Can't use regular ? to specify optional paramter in this regexp version
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
app.get('', (request, response) => {

});
// app.post();
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


