const API_URL = "http://localhost:8000";

export async function postData(endpoint, data) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getData(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`);
  return res.json();
}
