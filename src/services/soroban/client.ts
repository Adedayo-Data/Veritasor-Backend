import { rpc } from "@stellar/stellar-sdk";
import { config } from "../../config";

let _client: rpc.Server | null = null;

/**
 * Returns a singleton Soroban RPC client.
 *
 * Uses `config.soroban.rpcUrl`. `allowHttp` is enabled only when the URL
 * is non-HTTPS (local dev / CI), so production always requires TLS.
 */
export function getSorobanClient(): rpc.Server {
	if (!_client) {
		_client = new rpc.Server(config.soroban.rpcUrl, {
			allowHttp: !config.soroban.rpcUrl.startsWith("https"),
		});
	}
	return _client;
}
