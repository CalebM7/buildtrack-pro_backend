import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const sanitize = (dirty) => {
  return purify.sanitize(dirty, {USE_PROFILES: {html: true}});
}

export default sanitize;