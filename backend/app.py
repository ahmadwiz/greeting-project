from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app)


@app.route("/time", methods=["GET"])
def get_time():
    current_time = datetime.now(timezone.utc).strftime(
        "%Y-%m-%d %H:%M:%S UTC"
    )

    return jsonify({"time": current_time})


@app.route("/greet", methods=["POST"])
def greet():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"message": "Please send a name."}), 400

    name = data.get("name")

    return jsonify({
        "message": f"Hello, {name.strip()}. Welcome to my website."
    })


if __name__ == "__main__":
    app.run(port=5000)