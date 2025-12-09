import API from '../api/client';

export const calendarService = {
  convertDate: (date) =>
    API.get('/calendar/convert', { params: { date } }),

  convertReverse: (year, month, day) =>
    API.get('/calendar/convert-reverse', { params: { year, month, day } }),

  getHolidays: () =>
    API.get('/calendar/holidays'),

  getZodiacInfo: (year) =>
    API.get(`/calendar/zodiac/${year}`),

  getFavorites: () =>
    API.get('/favorites'),

  addFavorite: (favorite) =>
    API.post('/favorites', favorite),

  deleteFavorite: (id) =>
    API.delete(`/favorites/${id}`)
};