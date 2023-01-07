import { headers } from "../../headers.mjs";
import fetch from "node-fetch";

export async function handler(event) {
	const { backend, redirect_uri, code } = JSON.parse(event.body);

	let info = ["id", "secret", "url", "fields"].map(i => [i, process.env[`${backend}_${i}`.toUpperCase()]]);
	info = Object.fromEntries(info);

	const url = new URL(info.url);
	const params = new URLSearchParams(info.fields);
	params.set("client_id", info.id);
	params.set("client_secret", info.secret);
	params.set("code", code);
	params.set("redirect_uri", redirect_uri ?? "https://auth-madata.netlify.app");

	url.search = params.toString();

	const response = await fetch(url.href, {
		method: "POST"
	});

	let token;
	if (backend === "Github") {
		token = (await response.text()).match(/access_token=(\w+)/)[1];
	} else {
		token = (await response.json())["access_token"];
	}

	if (!response.ok) {
		console.error("We got an error", response.status);
	}

	return {
		statusCode: 200,
		headers,
		body: JSON.stringify({ message: "You are authenticated successfully!", token })
	};
}
