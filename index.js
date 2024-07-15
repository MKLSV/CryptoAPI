const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Получение исторических данных за последний месяц с 15-минутным таймфреймом
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
    res.json(response.data);
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
