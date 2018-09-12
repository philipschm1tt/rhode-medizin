import React from 'react'
import PropTypes from 'prop-types'
import MainGrid from './mainGrid'

const Article = props => (
  <MainGrid gridRow="2" as="article">
    {props.children}
  </MainGrid>
)

Article.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Article
