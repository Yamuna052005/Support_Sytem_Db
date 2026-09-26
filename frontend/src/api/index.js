import client from './client';

export const authApi = {
  login: (credentials) => client.post('/auth/login', credentials).then((r) => r.data),
  register: (data) => client.post('/auth/register', data).then((r) => r.data),
  me: () => client.get('/auth/me').then((r) => r.data.user),
};

export const ticketApi = {
  list: (params) => client.get('/tickets', { params }).then((r) => r.data.tickets),
  stats: () => client.get('/tickets/stats').then((r) => r.data.stats),
  get: (id) => client.get(`/tickets/${id}`).then((r) => r.data.ticket),
  create: (data) => client.post('/tickets', data).then((r) => r.data.ticket),
  update: (id, data) => client.put(`/tickets/${id}`, data).then((r) => r.data.ticket),
  remove: (id) => client.delete(`/tickets/${id}`),
  comments: (id) => client.get(`/tickets/${id}/comments`).then((r) => r.data.comments),
  addComment: (id, comment) =>
    client.post(`/tickets/${id}/comments`, { comment }).then((r) => r.data.comment),
};

export const userApi = {
  agents: () => client.get('/users', { params: { role: 'agent' } }).then((r) => r.data.users),
};
