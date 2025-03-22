export type ServerState = {
  ip: string;
  serverUrl: string;
  online: boolean;
};

const state: {
  registeredServers: {
    [T in string]: ServerState;
  };
} = {
  registeredServers: {},
};

export default state;
