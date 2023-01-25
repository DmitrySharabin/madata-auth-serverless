import fetch from "node-fetch";

import * as backends from "../backends.json";
import * as keys from "../keys.json";

const headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

export async function handler(event) {
	const { backend, code, redirectURI } = JSON.parse(event.body);

	const info = { ...backends[backend], ...keys[backend] };

	if (!info.url || !info.client_id || !info.client_secret) {
		console.error(`We don't support the ${backend} backend!`);
		return {
			statusCode: 404,
			headers,
			body: JSON.stringify({ message: `We don't support the ${backend} backend!` })
		};
	}

	const url = new URL(info.url);
	const params = new URLSearchParams(info.fields ?? "");
	params.set("code", code);
	params.set("client_id", info.client_id);
	params.set("client_secret", info.client_secret);
	params.set("redirect_uri", redirectURI ?? process.env.URL);

	url.search = "?" + params.toString();

	const response = await fetch(url.href, {
		method: "POST",
		headers: {
			Accept: "application/json"
		}
	});

	if (!response.ok) {
		console.error(`We got an error ${response.status} while obtaining an access token: ${response.statusText}`);
		return {
			statusCode: 400,
			headers,
			body: JSON.stringify({ message: response.statusText })
		};
	}

	const token = (await response.json())?.["access_token"];
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
