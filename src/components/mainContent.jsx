import React from 'react'
import PropTypes from 'prop-types'
import MainGrid from './mainGrid'

const MainContent = props => (
  <MainGrid gridRow={props.gridRow} as="article">
    {props.children}
  </MainGrid>
)

MainContent.propTypes = {
  gridRow: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

export default MainContent
