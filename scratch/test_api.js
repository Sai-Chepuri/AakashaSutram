const lat = 40.7128;
const lng = -74.0060;
const url = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lng}`;

try {
  const response = await fetch(url);
  if (response.ok) {
    const data = await response.json();
    console.log("TimeAPI.io Response:", JSON.stringify(data, null, 2));
  } else {
    console.log("Failed with status:", response.status);
  }
} catch (e) {
  console.log("Error:", e);
}
