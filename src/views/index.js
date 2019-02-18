import { connect } from "react-redux";
import SagaMonitorView from './sagaMonitorView';

const mapStateToProps = state => {
  return {
    state: state,
  }
}

export default connect(mapStateToProps, null)(SagaMonitorView);