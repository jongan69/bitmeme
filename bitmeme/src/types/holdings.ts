// ============================
// Response Types from Helius getAssetsByOwner API
// ============================

export interface GetAssetsByOwnerResponse {
    jsonrpc: "2.0";
    id: string;
    result: {
      total: number;
      limit: number;
      page: number;
      items: DigitalAsset[];
    };
  }
  
  export interface DigitalAsset {
    interface: string;
    id: string;
    content: {
      $schema: string;
      json_uri: string;
      files: {
        uri: string;
        cdn_uri: string;
        mime: string;
      }[];
    };
    authorities: {
      address: string;
      scopes: string[];
    }[];
    compression: {
      eligible: boolean;
      compressed: boolean;
      data_hash: string;
      creator_hash: string;
      asset_hash: string;
      tree: string;
      seq: number;
      leaf_id: number;
    };
    grouping: {
      group_key: string;
      group_value: string;
    }[];
    royalty: {
      royalty_model: string;
      target: string | null;
      percent: number;
      basis_points: number;
      primary_sale_happened: boolean;
      locked: boolean;
    };
    creators: {
      address: string;
      share: number;
      verified: boolean;
    }[];
    ownership: {
      frozen: boolean;
      delegated: boolean;
      delegate?: string;
      ownership_model: string;
      owner: string;
    };
    supply: {
      print_max_supply: number;
      print_current_supply: number;
      edition_nonce: number;
    };
    mutable: boolean;
    burnt: boolean;
  }
  
export type HoldingList = DigitalAsset[];

export interface NativeBalance {
    lamports: number;
    price_per_sol: number;
    total_price: number;
}