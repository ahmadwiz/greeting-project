import os
from uuid import uuid4

from azure.core.exceptions import AzureError
from azure.data.tables import TableClient
from azure.identity import ManagedIdentityCredential
from flask import Flask, jsonify, request

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 4096

SITE_ORIGIN = os.environ.get("SITE_ORIGIN", "").rstrip("/")
PARTITION = "guestbook"


def guestbook():
    return TableClient(
        endpoint="https://greetingstorage1.table.core.windows.net",
        table_name="Guestbook",
        credential=ManagedIdentityCredential(),
    )


def signed_in_user():
    # Use these headers only behind Azure App Service Authentication.
    if request.headers.get("X-MS-CLIENT-PRINCIPAL-ID"):
        return request.headers.get("X-MS-CLIENT-PRINCIPAL-NAME")
    return None


@app.get("/")
def home():
    return app.send_static_file("index.html")


@app.get("/me")
def me():
    response = jsonify({"username": signed_in_user()})
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/messages")
def get_messages():
    try:
        with guestbook() as table:
            rows = table.query_entities(
                query_filter="PartitionKey eq @partition",
                parameters={"partition": PARTITION},
            )
            messages = [
                {"author": row["author"], "message": row["message"]}
                for row in rows
            ]
        return jsonify({"messages": messages})
    except AzureError:
        app.logger.exception("Could not read Guestbook")
        return jsonify({"error": "Could not load messages."}), 503


@app.post("/messages")
def post_message():
    username = signed_in_user()
    if not username:
        return jsonify({"error": "Sign in before posting."}), 401

    if not SITE_ORIGIN or request.headers.get("Origin") != SITE_ORIGIN:
        return jsonify({"error": "Post from the guestbook page."}), 403

    data = request.get_json(silent=True)
    message = data.get("message") if isinstance(data, dict) else None

    if not isinstance(message, str):
        return jsonify({"error": "Enter a message."}), 400

    message = message.strip()
    if not 1 <= len(message) <= 200:
        return jsonify({"error": "Use 1 to 200 characters."}), 400

    try:
        with guestbook() as table:
            table.create_entity({
                "PartitionKey": PARTITION,
                "RowKey": uuid4().hex,
                "author": username,
                "message": message,
            })
        return jsonify({"message": "Message saved."}), 201
    except AzureError:
        app.logger.exception("Could not write to Guestbook")
        return jsonify({"error": "Could not save your message."}), 503