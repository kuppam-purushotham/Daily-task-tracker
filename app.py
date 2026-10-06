from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

DATABASE = "lifetrack.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration INTEGER NOT NULL
        )
    """)

    connection.commit()
    connection.close()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/add_activity", methods=["POST"])
def add_activity():

    data = request.get_json()

    if not data:
        return jsonify({"error": "No data received"}), 400

    task = data.get("task")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    duration = data.get("duration")

    if not task or not start_time or not end_time:
        return jsonify({"error": "Missing activity information"}), 400

    connection = get_connection()

    connection.execute("""
        INSERT INTO activities
        (task, start_time, end_time, duration)
        VALUES (?, ?, ?, ?)
    """, (
        task,
        start_time,
        end_time,
        duration
    ))

    connection.commit()
    connection.close()

    return jsonify({
        "success": True,
        "message": "Activity saved"
    })


@app.route("/activities")
def activities():

    connection = get_connection()

    rows = connection.execute("""
        SELECT
            id,
            task,
            start_time,
            end_time,
            duration
        FROM activities
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    result = []

    for row in rows:
        result.append({
            "id": row["id"],
            "task": row["task"],
            "start_time": row["start_time"],
            "end_time": row["end_time"],
            "duration": row["duration"]
        })

    return jsonify(result)
init_db()

if __name__ == "__main__":
    
    app.run(debug=True)