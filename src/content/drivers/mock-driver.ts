import { PublishRequest, PublishResult } from '../publisher';

export class MockDriver {
  upload = async (req: PublishRequest): Promise<PublishResult> => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MockDriver is strictly prohibited in production environments.');
    }
    const id = `mock_vid_${Date.now()}`;
    return {
      success: true,
      publishedVideoId: id,
      publishId: `mock_pub_${Date.now()}`,
      url: `https://www.tiktok.com/@${req.accountId}/video/${id}`,
      driverType: 'MOCK',
      providerStatus: 'PUBLISH_COMPLETE',
      privacyLevel: 'SELF_ONLY',
    };
  };
}
