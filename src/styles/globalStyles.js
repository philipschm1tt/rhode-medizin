import { injectGlobal } from 'styled-components'
import styledReset from 'styled-reset'

const globalStyles = theme => () =>
  injectGlobal`
  ${styledReset}

  body {
    background-color: ${theme.colors.base};
    font-family: sans-serif;
  }

  h1, h2, h3 {
    color: ${theme.colors.companyBlue};
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
    margin-top: ${theme.sizes.baseLineHeight};
    margin-bottom: ${theme.sizes.halfBaseLineHeight};
    font-weight: bold;

    @media (min-width: ${theme.sizes.breakpoints.large}) {
      font-size: ${theme.fontSizes.largeScreens.XL};
      line-height: ${theme.lineHeights.largeScreens.XL};
      margin-top: ${theme.sizes.halfBaseLineHeight};
      margin-bottom: ${theme.sizes.baseLineHeight};
    }
  }

  h3 {
    font-size: ${theme.fontSizes.smallScreens.L};
    line-height: ${theme.lineHeights.smallScreens.L};
    margin-bottom: ${theme.sizes.baseLineHeight};
    margin-top: ${theme.sizes.halfBaseLineHeight};
    font-weight: bold;

    @media (min-width: ${theme.sizes.breakpoints.large}) {
      font-size: ${theme.fontSizes.largeScreens.L};
      line-height: ${theme.lineHeights.largeScreens.L};
      margin-bottom: ${theme.sizes.baseLineHeight};
      margin-top: ${theme.sizes.halfBaseLineHeight};
    }
  }

  h4, h5, h6 {
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
    font-size: ${theme.fontSizes.smallScreens.M};
    line-height: ${theme.lineHeights.smallScreens.M};
    margin-bottom: ${theme.sizes.baseLineHeight};
    max-width: 30em;

    @media (min-width: ${theme.sizes.breakpoints.large}) {
      font-size: ${theme.fontSizes.largeScreens.M};
      line-height: ${theme.lineHeights.largeScreens.M};
      margin-bottom: ${theme.sizes.baseLineHeight};
    }
  }

  li {
    font-size: ${theme.fontSizes.smallScreens.M};
    line-height: ${theme.lineHeights.smallScreens.M};
    max-width: 30em;

    @media (min-width: ${theme.sizes.breakpoints.large}) {
      font-size: ${theme.fontSizes.largeScreens.M};
      line-height: ${theme.lineHeights.largeScreens.M};
    }
  }

  ol, ul {
    list-style: inside;
    margin: ${theme.sizes.halfBaseLineHeight} 0;
  }
`

export default globalStyles
