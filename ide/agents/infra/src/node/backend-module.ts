import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, RpcConnectionHandler } from '@theia/core/lib/common';
import { graphLedgerPath } from '../common/graph-ledger-protocol.js';
import { configuredGraphLedger, publicLedgerEndpoint } from './graph-ledger-reader.js';

export default new ContainerModule(bind => {
    const service = configuredGraphLedger();
    const endpoint = publicLedgerEndpoint(service);
    bind(ConnectionHandler).toConstantValue(new RpcConnectionHandler(graphLedgerPath, () => endpoint));
});
