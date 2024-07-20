const express = require('express');
const { RestClientV5 } = require('bybit-api');
const csvWriter = require('csv-writer').createObjectCsvStringifier;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const client = new RestClientV5({
    testnet: true, // Установите в false для использования основного API
});

app.use(express.static(path.join(__dirname, 'public')));

// Получение полных исторических данных с 15-минутным таймфреймом и возможность скачивания CSV файла
app.get('/historical/:cryptoId', async (req, res) => {
  const cryptoId = req.params.cryptoId;
  const interval = '15'; // 15-минутный таймфрейм
  const endDate = Math.floor(Date.now() / 1000); // Текущая дата в формате Unix Timestamp
  const startDate = endDate - (30 * 24 * 60 * 60); // 30 дней назад

  try {
    const response = await client.getKline({
      category: 'linear', // Используем категорию 'linear' для большинства торговых пар
      symbol: `${cryptoId.toUpperCase()}USD`,
      interval,
      start: startDate * 1000,
      end: endDate * 1000,
    });

    // Форматирование данных
    const formattedData = response.result.list.map(data => ({
      date: new Date(data.startTime).toISOString(),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
    }));

    if (req.query.format === 'csv') {
      const csvStringifier = new csvWriter({
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
  const cryptoId = req.params.cryptoId;
  try {
    const response = await client.getKline({
      category: 'linear',
      symbol: `${cryptoId.toUpperCase()}USD`,
      interval: '1',
      limit: 1,
    });

    const latestData = response.result.list[0];
    const formattedData = {
      date: new Date(latestData.startTime).toISOString(),
      open: latestData.open,
      high: latestData.high,
      low: latestData.low,
      close: latestData.close,
      volume: latestData.volume,
    };

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching real-time data from Bybit API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
