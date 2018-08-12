import { injectGlobal } from 'styled-components'
import styledNormalize from 'styled-normalize'

const globalStyles = theme => () =>
  injectGlobal`
  ${styledNormalize}

  body {
    background-color: ${theme.colors.lightYellow};
    font-family: sans-serif;
  }

  h1 {
    font-size: ${theme.fontSizes.XXL};
    line-height: ${theme.lineHeights.XXL}
  }

  h2 {
    font-size: ${theme.fontSizes.XL};
    line-height: ${theme.lineHeights.XL}
  }

  h3, h4, h5, h6, p {
    font-size: ${theme.fontSizes.L};
    line-height: ${theme.lineHeights.L}
  }
`

export default globalStyles
