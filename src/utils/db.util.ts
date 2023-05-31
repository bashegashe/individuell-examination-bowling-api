import mongoose from 'mongoose';
import { Lane } from '../models/Lane';

const uri = 'mongodb+srv://test:test@playground.nf0yixr.mongodb.net/bowling?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
  console.log('Connected to MongoDB');

  await Lane.addLanesIfNotExists();
}).catch((err) => {
  console.error(err);
});

export const db = mongoose.connection;
