import { BaseAdapterPlugin } from './base.adapter';
import type { AdapterCapability, PluginContext } from '../plugin-types';

export class KagiAdapter extends BaseAdapterPlugin {
  readonly name = 'KagiAdapter';
  readonly version = '1.0.0';
  readonly hostnames = ['kagi.com'];
  readonly capabilities: AdapterCapability[] = [
    'text-insertion',
    'form-submission',
  ];

  // These selectors are educated guesses and need to be verified
  private readonly selectors = {
    CHAT_INPUT: 'textarea',
    SUBMIT_BUTTON: 'button[type="submit"]',
    IFRAME: 'iframe[src*="sidekick-ui-next.kagi.com"]',
  };

  private async getIframeDocument(): Promise<Document | null> {
    return new Promise((resolve) => {
      const iframe = document.querySelector(this.selectors.IFRAME) as HTMLIFrameElement;
      if (!iframe) {
        this.context.logger.error('Kagi iframe not found');
        resolve(null);
        return;
      }

      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        resolve(iframe.contentDocument);
        return;
      }

      iframe.onload = () => {
        resolve(iframe.contentDocument);
      };
    });
  }

  async insertText(text: string): Promise<boolean> {
    const iframeDoc = await this.getIframeDocument();
    if (!iframeDoc) {
      return false;
    }

    const chatInput = iframeDoc.querySelector(this.selectors.CHAT_INPUT) as HTMLTextAreaElement;
    if (!chatInput) {
      this.context.logger.error('Kagi chat input not found');
      return false;
    }

    chatInput.value = text;
    chatInput.dispatchEvent(new Event('input', { bubbles: true }));

    return true;
  }

  async submitForm(): Promise<boolean> {
    const iframeDoc = await this.getIframeDocument();
    if (!iframeDoc) {
      return false;
    }

    const submitButton = iframeDoc.querySelector(this.selectors.SUBMIT_BUTTON) as HTMLButtonElement;
    if (!submitButton) {
      this.context.logger.error('Kagi submit button not found');
      return false;
    }

    submitButton.click();
    return true;
  }
}
