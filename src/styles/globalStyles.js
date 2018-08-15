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
    font-size: ${theme.fontSizes.smallScreens.XXL};
    line-height: ${theme.lineHeights.smallScreens.XXL};
    margin-bottom: ${theme.sizes.halfBaseLineHeight};
    font-weight: bold;

    @media (min-width: ${theme.sizes.breakpoints.large}) {
      font-size: ${theme.fontSizes.largeScreens.XXL};
      line-height: ${theme.lineHeights.largeScreens.XXL};
      margin-bottom: ${theme.sizes.halfBaseLineHeight};
    }
  }

  h2 {
    font-size: ${theme.fontSizes.smallScreens.XL};
    line-height: ${theme.lineHeights.smallScreens.XL};
    margin-bottom: ${theme.sizes.halfBaseLineHeight};

    @media (min-width: ${theme.sizes.breakpoints.large}) {
      font-size: ${theme.fontSizes.largeScreens.XL};
      line-height: ${theme.lineHeights.largeScreens.XL};
      margin-bottom: ${theme.sizes.halfBaseLineHeight};
    }
  }

  h3, h4, h5, h6 {
    font-size: ${theme.fontSizes.smallScreens.L};
    line-height: ${theme.lineHeights.smallScreens.L};
    margin: ${theme.sizes.halfBaseLineHeight} 0;
    font-weight: bold;

    @media (min-width: ${theme.sizes.breakpoints.large}) {
      font-size: ${theme.fontSizes.largeScreens.L};
      line-height: ${theme.lineHeights.largeScreens.L};
      margin: ${theme.sizes.halfBaseLineHeight} 0;
    }
  }

  p {
    font-size: ${theme.fontSizes.smallScreens.L};
    line-height: ${theme.lineHeights.smallScreens.L};
    margin-bottom: ${theme.sizes.baseLineHeight};

    @media (min-width: ${theme.sizes.breakpoints.large}) {
      font-size: ${theme.fontSizes.largeScreens.L};
      line-height: ${theme.lineHeights.largeScreens.L};
      margin-bottom: ${theme.sizes.baseLineHeight};
    }
  }

  h1, h2 {
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }

  p, li {
    max-width: 30em;
  }

  ol, ul {
    list-style: inside;
    margin: ${theme.sizes.halfBaseLineHeight} 0;
  }
`

export default globalStyles
