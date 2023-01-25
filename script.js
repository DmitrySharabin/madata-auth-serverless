const params = new URLSearchParams(location.search);

if (!params.has("state")) {
	auth.remove();

	const response = await fetch("/services.json");
	if (response.ok) {
		const backends = await response.json();

		backend_list.innerHTML = Object.entries(backends).map(([name, meta]) => {
			let id = name.toLowerCase();
			return `
			<li class="${id} backend">
				<img src="${ meta.icon ?? "img/default-logo.svg" }" alt="${name} logo" />
				<a href="https://madata.dev/backends/${id}">${name}</a>
			</li>`
		}).join("\n");
	}
}
else {
	supported.remove();

	const state = JSON.parse(params.get("state"));
	const url = state.url;
	const backend = state.backend;

	const code = params.get("code");

	if (backend && url && code) {
		auth.removeAttribute("hidden");
		const appURL = document.querySelector("#url");
		appURL.textContent = url;
		appURL.href = url;

		backend_name.textContent = backend;

		const response = await fetch("/.netlify/functions/auth", {
			method: "POST",
			body: JSON.stringify({ backend, code, redirectURI: params.get("redirect_uri") })
		});
		const json = await response.json();

		yes_button.addEventListener("click", async () => {
			const token = json.token;

			if (!token) {
				throw new Error("We could not obtain an access token!");
			}
			else {
				opener.postMessage({ backend, token }, url);
			}

			window.close();
		});

		no_button.addEventListener("click", async () => {
			window.close();
		});
	}
	else {
		// TODO better error message
		document.body.textContent = "The URL you provided is invalid. You can't be authenticated!";
	}
}
