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

    // Форматирование данных
    const formattedData = response.data.prices.map((price, index) => {
      const open = index === 0 ? price[1] : response.data.prices[index - 1][1];
      const close = price[1];
      const high = Math.max(...response.data.prices.slice(Math.max(index - 15, 0), index + 1).map(p => p[1]));
      const low = Math.min(...response.data.prices.slice(Math.max(index - 15, 0), index + 1).map(p => p[1]));
      const volume = response.data.total_volumes[index][1];

      return {
        date: new Date(price[0]).toISOString(),
        open,
        high,
        low,
        close,
        volume
      };
    });

    if (req.query.format === 'csv') {
      const csvStringifier = new csvWriter({
        header: [
          {id: 'date', title: 'date'},
          {id: 'open', title: 'open'},
          {id: 'high', title: 'high'},
          {id: 'low', title: 'low'},
          {id: 'close', title: 'close'},
          {id: 'volume', title: 'volume'}
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
