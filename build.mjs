import fs from "fs";

let backends, keys;
try {
	const data = fs.readFileSync("./backends.json", "utf8");
	backends = JSON.parse(data);
} catch (error) {
	throw new Error("Error reading file backends.json!");
}

try {
	const data = fs.readFileSync("./keys.json", "utf8");
	keys = JSON.parse(data);
} catch (error) {
	throw new Error("Error reading file keys.json!");
}

const services = [];
for (const backend in backends) {
	const info = { ...backends[backend], ...keys[backend] };
	if (info.url && info.client_id && info.client_secret) {
		services.push(backend);
	}
}

try {
	const data = JSON.stringify(services);
	fs.writeFileSync("./public/services.json", data, "utf8");
} catch (error) {
	console.error("Error writing file services.json!");
}
