import type { Command, ControlState } from '@chros/shared';

export type SendCommand = (command: Command) => Promise<boolean>;

export type ControlProps = {
  state: ControlState;
  send: SendCommand;
};
