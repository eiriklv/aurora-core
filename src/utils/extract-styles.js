// Dependencies
import createDebug from 'debug';
import CleanCSS from 'clean-css';
import lru from 'lru-cache';
import md5 from 'md5';

// Instantiate
const debug = createDebug('aurora-frontend:extract-styles');
const cleanCSS = new CleanCSS();

/**
 * Create a LRU cache that
 * stores a maximum of 500 entries
 */
const cache = lru({ max: 500 });

/**
 * Function for extracting all critical
 * styles from an Aurora config
 */
export default function extractStyles(
  app = { options: { modules: [] } }
) {
  /**
   * Create an initial array to hold all the styles
   */
  const criticalStyles = [];

  /**
   * Create a function that recurses
   * through the entire config to find
   * styles to extract (static getStyles() method on every module)
   */
  function extractStylesRecursively({
    type: { getStyles = () => '' },
    options: { modules = [] },
  }) {
    criticalStyles.push(getStyles());
    modules.forEach(extractStylesRecursively);
  }

  /**
   * Extract all styles from the config / app specification
   */
  extractStylesRecursively(app);

  /**
   * Create a concatenated string of
   * the critical styles that was extracted
   */
  const styles = criticalStyles.join('');

  /**
   * Create a hash of the extracted styles
   * for identification
   */
  const hash = md5(styles);

  /**
   * Add the minified styles to the
   * cache if they don't already exist
   */
  if (!cache.has(hash)) {
    cache.set(hash, cleanCSS.minify(styles).styles);
  }

  /**
   * Log the cache size for each time
   */
  debug('css cache size:', cache.itemCount);

  /**
   * Return the minified styles from the cache
   */
  return cache.get(hash);
}
