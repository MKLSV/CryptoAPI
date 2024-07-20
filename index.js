const express = require('express');
const axios = require('axios');
const { createObjectCsvStringifier } = require('csv-writer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Получение полных исторических данных с 15-минутным таймфреймом и возможность скачивания CSV файла
app.get('/historical/:cryptoId', async (req, res) => {
  const cryptoId = req.params.cryptoId.toUpperCase();
  const interval = '15'; // 15-минутный таймфрейм
  const endDate = Date.now(); // Текущая дата в миллисекундах
  const startDate = endDate - (14 * 24 * 60 * 60 * 1000); // 14 дней назад в миллисекундах

  try {
    const response = await axios.get('https://api.bybit.com/v5/market/kline', {
      params: {
        category: 'linear', // Используем категорию 'linear' для большинства торговых пар
        symbol: `${cryptoId}USDT`,
        interval,
        start: startDate,
        end: endDate,
      }
    });

    // Форматирование данных
    const formattedData = response.data.result.list.map(data => ({
      date: new Date(parseInt(data[0])).toISOString(),
      open: parseFloat(data[1]),
      high: parseFloat(data[2]),
      low: parseFloat(data[3]),
      close: parseFloat(data[4]),
      volume: parseFloat(data[5]),
    }));

    if (req.query.format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'date', title: 'date' },
          { id: 'open', title: 'open' },
          { id: 'high', title: 'high' },
          { id: 'low', title: 'low' },
          { id: 'close', title: 'close' },
          { id: 'volume', title: 'volume' }
        ]
      });

      const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(formattedData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${cryptoId}_historical_data.csv"`);
      res.send(csvData);
    } else {
      res.json(formattedData);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching historical data from Bybit API' });
  }
});

// Получение данных в реальном времени с 15-минутным таймфреймом
app.get('/price/:cryptoId', async (req, res) => {
  const cryptoId = req.params.cryptoId.toUpperCase();
  try {
    const response = await axios.get('https://api.bybit.com/v5/market/kline', {
      params: {
        category: 'linear',
        symbol: `${cryptoId}USDT`,
        interval: '15',
        limit: 1,
      }
    });

    const latestData = response.data.result.list[0];
    const formattedData = {
      date: new Date(parseInt(latestData[0])).toISOString(),
      open: parseFloat(latestData[1]),
      high: parseFloat(latestData[2]),
      low: parseFloat(latestData[3]),
      close: parseFloat(latestData[4]),
      volume: parseFloat(latestData[5]),
    };

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching real-time data from Bybit API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
