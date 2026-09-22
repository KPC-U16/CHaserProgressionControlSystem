import 'server-only';
import { EventEmitter } from 'node:events';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { stateSchema, type Command, type ControlState } from '@chros/shared';
import { applyCommand, createInitialState } from './tournament';

const dataDir = process.env.CHROS_DATA_DIR || path.join(process.cwd(), '.chros');
const dataFile = path.join(dataDir, 'state.json');
const globalBus = globalThis as unknown as { __chrosControlBus?: EventEmitter };
const bus = (globalBus.__chrosControlBus ??= new EventEmitter());
bus.setMaxListeners(0);

function writeState(state: ControlState) {
  mkdirSync(dataDir, { recursive: true });
  const temporary = `${dataFile}.tmp`;
  const fd = openSync(temporary, 'w', 0o600);
  try {
    writeFileSync(fd, JSON.stringify(state));
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temporary, dataFile);
}
export function readState(): ControlState {
  if (!existsSync(dataFile)) {
    const state = createInitialState();
    writeState(state);
    return state;
  }
  // 壊れた保存ファイルはサンプルで上書きしない。
  return stateSchema.parse(JSON.parse(readFileSync(dataFile, 'utf8')));
}
export class RevisionConflict extends Error {}
export function dispatch(command: Command, expectedRevision: number): ControlState {
  // 単一Nodeプロセス内で、読取→検証→保存→通知を同期実行する。
  const previous = readState();
  if (previous.revision !== expectedRevision)
    throw new RevisionConflict(
      '別の操作で更新されました。最新の表示を確認してから、もう一度操作してください。',
    );
  const next = stateSchema.parse(applyCommand(previous, command));
  const backup =
    command.type === 'reset'
      ? `archive-${Date.now()}-${previous.revision}.json`
      : 'state.previous.json';
  writeFileSync(path.join(dataDir, backup), JSON.stringify(previous), { mode: 0o600 });
  writeState(next);
  bus.emit('state', next);
  return next;
}
export function subscribeState(listener: (state: ControlState) => void) {
  bus.on('state', listener);
  return () => {
    bus.off('state', listener);
  };
}
