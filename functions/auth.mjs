import fetch from "node-fetch";

const headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const backends = {
	Github: {
		id: "b28e2d03c956b3749798",
		secret: "",
		url: "https://github.com/login/oauth/access_token",
		fields: ""
	},
	Google: {
		id: "380712995757-4e9augrln1ck0soj8qgou0b4tnr30o42.apps.googleusercontent.com",
		secret: "",
		url: "https://oauth2.googleapis.com/token",
		fields: "grant_type=authorization_code"
	},
	Dropbox: {
		id: "2mx6061p054bpbp",
		secret: "",
		url: "https://api.dropboxapi.com/oauth2/token",
		fields: "grant_type=authorization_code"
	}
};

export async function handler(event) {
	const { backend, code, redirectURI } = JSON.parse(event.body);

	const info = backends[backend];

	const url = new URL(info.url);
	const params = new URLSearchParams(info.fields);
	params.set("code", code);
	params.set("client_id", info.id);
	params.set("client_secret", info.secret || process.env[`${backend}_secret`.toUpperCase()]);
	params.set("redirect_uri", redirectURI ?? process.env.URL);

	url.search = "?" + params.toString();

	const response = await fetch(url.href, {
		method: "POST"
	});

	if (!response.ok) {
		console.error(`We got an error ${response.status} while obtaining an access token: ${response.statusText}`);
		return {
			statusCode: 400,
			headers,
			body: JSON.stringify({ message: response.statusText })
		};
	}

	let token;
	if (backend === "Github") {
		token = (await response.text()).match(/access_token=(\w+)/)[1];
	} else if (backend === "Google") {
		token = (await response.json())["access_token"];
	}

	if (!token) {
		console.error("We could not obtain an access token!");
		return {
			statusCode: 404,
			headers,
			body: JSON.stringify({ message: "We could not obtain an access token!" })
		};
	}

	return {
		statusCode: 200,
		headers,
		body: JSON.stringify({ message: "You have been authenticated successfully!", token })
	};
}
