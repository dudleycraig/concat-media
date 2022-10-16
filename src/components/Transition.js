import PropTypes from 'prop-types';

const Transition = ({type, source, children}) => children;

Transition.propTypes = {
  type: PropTypes.oneOf(['next', 'current', 'previous']),
  source: PropTypes.string
}

export default Transition;
