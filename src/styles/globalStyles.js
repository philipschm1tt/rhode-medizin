import { injectGlobal } from 'styled-components'
import styledReset from 'styled-reset'

const globalStyles = theme => () =>
  injectGlobal`
  ${styledReset}

  body {
    background-color: ${theme.colors.lightYellow};
    font-family: sans-serif;
  }

  h1 {
    font-size: ${theme.fontSizes.XXL};
    line-height: ${theme.lineHeights.XXL};
    font-weight: bold;
    margin-bottom: ${theme.sizes.halfBaseLineHeight};
  }

  h2 {
    font-size: ${theme.fontSizes.XL};
    line-height: ${theme.lineHeights.XL};
    margin-bottom: ${theme.sizes.halfBaseLineHeight};
  }

  h3, h4, h5, h6 {
    font-size: ${theme.fontSizes.L};
    line-height: ${theme.lineHeights.L};
    font-weight: bold;
    margin: ${theme.sizes.halfBaseLineHeight} 0;
  }

  p {
    font-size: ${theme.fontSizes.L};
    line-height: ${theme.lineHeights.L};
    margin-bottom: ${theme.sizes.baseLineHeight};
  }

  h1, h2 {
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }

  ol, ul {
    list-style: inside;
    margin: ${theme.sizes.halfBaseLineHeight} 0;
  }
`

export default globalStyles
