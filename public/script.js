async function getRealTimeData() {
  const cryptoId = document.getElementById('cryptoId').value;
  const response = await fetch(`/price/${cryptoId}`);
  const data = await response.json();
  document.getElementById('output').textContent = JSON.stringify(data, null, 2);
}

async function getHistoricalData() {
  const cryptoId = document.getElementById('cryptoId').value;
  const response = await fetch(`/historical/${cryptoId}`);
  const data = await response.json();
  document.getElementById('output').textContent = JSON.stringify(data, null, 2);
}

function downloadCSV() {
  const cryptoId = document.getElementById('cryptoId').value;
  window.location.href = `/historical/${cryptoId}?format=csv`;
}
