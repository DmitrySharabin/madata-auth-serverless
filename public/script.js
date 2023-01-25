(async () => {
	const params = new URLSearchParams(location.search);

	if (!params.has("state")) {
		document.querySelector(".auth").remove();

		const response = await fetch("/services.json");
		if (response.ok) {
			const backends = await response.json();

			if (backends?.length) {
				document.querySelector(".info").removeAttribute("hidden");

				const list = document.querySelector(".list");

				const fragment = new DocumentFragment();
				for (const backend of backends) {
					const a = document.createElement("a");
					a.textContent = backend;
					a.href = "https://madata.dev/backends/" + backend.toLowerCase();
					a.target = "_blank";

					const li = document.createElement("li");
					li.classList.add(backend.toLowerCase(), "backend");
					li.append(a);

					fragment.append(li);
				}

				list.append(fragment);
			}
		}

		return;
	}

	const state = JSON.parse(params.get("state"));
	const url = state.url;
	const backend = state.backend;

	const code = params.get("code");

	if (!backend || !url || !code) {
		document.body.textContent = "The URL you provided is invalid. You can't be authenticated!";
		return;
	}

	const appURL = document.querySelector("#url");
	appURL.textContent = url;
	appURL.href = url;

	const backendName = document.querySelector("#backend");
	backendName.textContent = backend;

	const response = await fetch("/.netlify/functions/auth", {
		method: "POST",
		body: JSON.stringify({ backend, code, redirectURI: params.get("redirect_uri") })
	});
	const json = await response.json();

	const yesButton = document.querySelector("button.yes");
	yesButton.addEventListener("click", async () => {
		const token = json.token;

		if (!token) {
			throw new Error("We could not obtain an access token!");
		} else {
			opener.postMessage({ backend, token }, url);
		}

		window.close();
	});

	const noButton = document.querySelector("button.no");
	noButton.addEventListener("click", async () => {
		window.close();
	});
})();
