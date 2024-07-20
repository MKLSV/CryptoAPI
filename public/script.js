async function getData() {
  const category = document.getElementById('category').value;
  const symbol = document.getElementById('symbol').value;
  const interval = document.getElementById('interval').value;
  const start = new Date(document.getElementById('start').value).getTime();
  const end = new Date(document.getElementById('end').value).getTime();

  try {
    const response = await fetch(`/get-data?category=${category}&symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'data.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('output').textContent = `Error: ${error.message}`;
  }
}
