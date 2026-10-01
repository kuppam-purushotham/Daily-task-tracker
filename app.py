from flask import Flask, render_template, request, jsonify
app = Flask(__name__)
def init_db():
    connection = sqlite3.connect("lifetrack.db")

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

    task = data["task"]
    start_time = data["start_time"]
    end_time = data["end_time"]
    duration = data["duration"]

    connection = sqlite3.connect("lifetrack.db")

    connection.execute(
        """
        INSERT INTO activities
        (task, start_time, end_time, duration)
        VALUES (?, ?, ?, ?)
        """,
        (task, start_time, end_time, duration)
    )

    connection.commit()
    connection.close()

    return jsonify({"message": "Activity saved!"})

if __name__ == "__main__":
    init_db()
    app.run(debug=True)