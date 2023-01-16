import fetch from "node-fetch";

import { backends } from "../backends.mjs";

const headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS"
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
