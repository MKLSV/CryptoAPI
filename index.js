const express = require('express');
const axios = require('axios');
const csvWriter = require('csv-writer').createObjectCsvStringifier;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Получение полных исторических данных за последний месяц с 15-минутным таймфреймом и возможность скачивания CSV файла
app.get('/historical/:cryptoId', async (req, res) => {
  const cryptoId = req.params.cryptoId;
  try {
    const endDate = Math.floor(Date.now() / 1000); // Текущая дата в формате Unix Timestamp
    const startDate = endDate - (30 * 24 * 60 * 60); // 30 дней назад
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart/range`, {
      params: {
        vs_currency: 'usd',
        from: startDate,
        to: endDate
      }
    });

    // Агрегация данных для 15-минутного интервала
    const prices = response.data.prices;
    const volumes = response.data.total_volumes;
    const aggregatedData = [];

    for (let i = 0; i < prices.length; i += 1) {
      const timestamp = prices[i][0];
      const open = prices[i][1];
      let high = prices[i][1];
      let low = prices[i][1];
      let close = prices[i][1];
      let volume = volumes[i][1];

      for (let j = 1; j < 4 && i + j < prices.length; j++) {
        high = Math.max(high, prices[i + j][1]);
        low = Math.min(low, prices[i + j][1]);
        close = prices[i + j][1];
        volume += volumes[i + j][1];
      }

      aggregatedData.push({
        date: new Date(timestamp).toISOString(),
        open,
        high,
        low,
        close,
        volume
      });

      // Пропускаем следующие 3 записи, чтобы перейти к следующему 15-минутному интервалу
      i += 3;
    }

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

      const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(aggregatedData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${cryptoId}_historical_data.csv"`);
      res.send(csvData);
    } else {
      res.json(aggregatedData);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching historical data from CoinGecko API' });
  }
});

// Получение данных в реальном времени с 15-минутным таймфреймом
app.get('/price/:cryptoId', async (req, res) => {
  const cryptoId = req.params.cryptoId;
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: cryptoId,
        vs_currencies: 'usd',
        include_last_updated_at: true
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching real-time data from CoinGecko API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
