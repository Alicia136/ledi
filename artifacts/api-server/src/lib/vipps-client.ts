import { logger } from "./logger";

interface TokenCache {
  token: string;
  expiresAt: number;
}

export interface VippsPayoutParams {
  reference: string;
  description: string;
  amountOre: number;
  phoneNumber: string;
}

export interface VippsInitiateParams {
  orderId: string;
  amountOre: number;
  callbackPrefix: string;
  fallbackUrl: string;
  transactionText: string;
  phoneNumber?: string;
}

class VippsClient {
  private tokenCache: TokenCache | null = null;

  isConfigured(): boolean {
    return !!(
      process.env.VIPPS_CLIENT_ID &&
      process.env.VIPPS_CLIENT_SECRET &&
      process.env.VIPPS_SUBSCRIPTION_KEY &&
      process.env.VIPPS_MSN
    );
  }

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const res = await fetch("https://api.vipps.no/accessToken/get", {
      method: "POST",
      headers: {
        "client_id": process.env.VIPPS_CLIENT_ID!,
        "client_secret": process.env.VIPPS_CLIENT_SECRET!,
        "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Vipps access token feil: ${res.status} ${body}`);
    }

    const data = await res.json() as { access_token: string; expires_in: string };
    const expiresIn = parseInt(data.expires_in, 10);

    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (expiresIn - 60) * 1000,
    };

    return data.access_token;
  }

  async initiatePayment(params: VippsInitiateParams): Promise<{ orderId: string; url: string }> {
    const token = await this.getAccessToken();
    const msn = process.env.VIPPS_MSN!;

    const body = {
      merchantInfo: {
        merchantSerialNumber: msn,
        callbackPrefix: params.callbackPrefix,
        fallBack: params.fallbackUrl,
        consentRemovalPrefix: `${params.callbackPrefix}/consent-removal`,
        isApp: false,
      },
      customerInfo: params.phoneNumber ? { mobileNumber: params.phoneNumber } : {},
      transaction: {
        orderId: params.orderId,
        amount: params.amountOre,
        transactionText: params.transactionText,
      },
    };

    const res = await fetch("https://api.vipps.no/ecomm/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
        "Merchant-Serial-Number": msn,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Vipps initiate feil: ${res.status} ${err}`);
    }

    return res.json() as Promise<{ orderId: string; url: string }>;
  }

  async sendPayout(params: VippsPayoutParams): Promise<{ success: boolean; error?: string }> {
    const token = await this.getAccessToken();
    const msn = process.env.VIPPS_MSN!;

    const body = {
      payouts: [
        {
          reference: params.reference,
          description: params.description,
          amount: { value: params.amountOre, currency: "NOK" },
          recipient: {
            recipientHandle: {
              type: "PHONE_NUMBER",
              value: params.phoneNumber,
            },
          },
        },
      ],
    };

    const res = await fetch(`https://api.vipps.no/payouts/v1/msn/${msn}/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
        "Merchant-Serial-Number": msn,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ msn, ref: params.reference, status: res.status }, `Vipps payout feil: ${err}`);
      return { success: false, error: `${res.status} ${err}` };
    }

    return { success: true };
  }
}

export const vippsClient = new VippsClient();
