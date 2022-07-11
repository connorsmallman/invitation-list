import { flow } from 'fp-ts/function';
import * as L from 'logger-fp-ts';
import { ReaderIO } from 'fp-ts-contrib/ReaderIO';
import { readerTaskEither as RTE } from 'fp-ts';
import {
  fromReaderIOK,
  chainFirstReaderIOK,
} from 'fp-ts-contrib/ReaderTaskEither';

const orElseFirstReaderIOK: <R, E, A>(
  onLeft: (e: E) => ReaderIO<R, A>,
) => <A>(ma: RTE.ReaderTaskEither<R, E, A>) => RTE.ReaderTaskEither<R, E, A> = (
  onLeft,
) => RTE.orElseFirst(fromReaderIOK(onLeft));

export const logInfoP = (message: string) =>
  chainFirstReaderIOK(flow(JSON.stringify, JSON.parse, L.infoP(message)));

export const logErrorP = (message: string) =>
  orElseFirstReaderIOK(flow(JSON.stringify, JSON.parse, L.errorP(message)));
