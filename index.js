const express = require('express');
const axios = require('axios');
const { createObjectCsvStringifier } = require('csv-writer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Функция для преобразования данных в CSV
function convertToCsv(data) {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'date', title: 'date' },
      { id: 'open', title: 'open' },
      { id: 'high', title: 'high' },
      { id: 'low', title: 'low' },
      { id: 'close', title: 'close' },
      { id: 'volume', title: 'volume' },
      { id: 'turnover', title: 'turnover' }
    ]
  });

  const records = data.map(entry => ({
    date: new Date(parseInt(entry[0])).toISOString(),
    open: entry[1],
    high: entry[2],
    low: entry[3],
    close: entry[4],
    volume: entry[5],
    turnover: entry[6]
  }));

  return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
}

// Функция для получения данных с Bybit API с обработкой лимита в 200 записей
async function fetchAllData(params) {
  let allData = [];
  let hasMore = true;
  let endTime = params.end;

  while (hasMore) {
    const response = await axios.get('https://api.bybit.com/v5/market/kline', {
      params: {
        ...params,
        end: endTime
      }
    });

    if (response.data.result && response.data.result.list) {
      const data = response.data.result.list;
      allData = allData.concat(data);

      if (data.length < 200) {
        hasMore = false;
      } else {
        endTime = data[data.length - 1][0];
      }
    } else {
      throw new Error('No data in response from Bybit API');
    }
  }

  return allData;
}

// Маршрут для получения данных и перевода их в CSV
app.get('/get-data', async (req, res) => {
  const { category, symbol, interval, start, end } = req.query;
  console.log(`Start: ${new Date(parseInt(start)).toISOString()}, End: ${new Date(parseInt(end)).toISOString()}`);

  try {
    const params = { category, symbol, interval, start, end };
    const allData = await fetchAllData(params);
    const csv = convertToCsv(allData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error fetching data from Bybit API:', error.message);
    res.status(500).json({ error: `Error fetching data from Bybit API: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
