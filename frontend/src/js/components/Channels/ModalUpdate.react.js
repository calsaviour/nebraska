import { applicationsStore } from "../../stores/Stores"
import React, { PropTypes } from "react"
import { Row, Col, Modal, Input, Button, Alert } from "react-bootstrap"
import ColorPicker from "react-color"

class ModalUpdate extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      channelColor: props.data.channel.color, 
      displayColorPicker: false,
      isLoading: false,
      alertVisible: false
    }
    this.handleFocus = this.handleFocus.bind(this)
    this.changeColor = this.changeColor.bind(this)
    this.handleColorPicker = this.handleColorPicker.bind(this)
    this.handleColorPickerClose = this.handleColorPickerClose.bind(this)
    this.updateChannel = this.updateChannel.bind(this)
  }

  static propTypes : {
    data: PropTypes.object
  }

  updateChannel() {
    this.setState({isLoading: true})
    let data = {
      id: this.props.data.channel.id,
      name: this.refs.nameNewChannel.getValue(),
      color: this.state.channelColor,
      application_id: this.props.data.channel.application_id
    }

    let package_id = this.refs.packageChannel.getValue()
    if (package_id) {
      data["package_id"] = package_id
    }

    applicationsStore.updateChannel(data).
      done(() => { 
        this.props.onHide()   
        this.setState({isLoading: false})
      }).
      fail(() => { 
        this.setState({alertVisible: true, isLoading: false})
      })
  }

  handleFocus() {
    this.setState({alertVisible: false})
  }

  handleColorPickerClose() {
    this.setState({ displayColorPicker: false })
  }

  handleColorPicker() {
    this.setState({ "displayColorPicker": !this.state.displayColorPicker })
  }

  changeColor(color) {
    this.setState({ channelColor: "#" + color.hex })
  }

  render() { 
    let packages = this.props.data.packages ? this.props.data.packages : [],
        selectedPackage = this.props.data.channel.package_id ? this.props.data.channel.package_id : "",
        popupPosition = {
          position: "absolute",
          top: "10px",
          left: "10px"
        },
        divColor = {
          backgroundColor: this.state.channelColor
        },
        btnStyle = this.state.isLoading ? " loading" : "",
        btnContent = this.state.isLoading ? "Please wait" : "Submit" 

    return (
      <Modal {...this.props} animation={true}>
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">Update channel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal--form">
            <form role="form" action="" onFocus={this.handleFocus}>
              <Input type="text" label="*Name:" defaultValue={this.props.data.channel.name} ref="nameNewChannel" required={true} maxLength={25} />
              <div className="form-group">
                <label className="control-label">
                  <span>Color:</span>
                </label>
                <div className="swatch" >
                  <div className="color" style={divColor} onClick={ this.handleColorPicker } />
                </div>
                <ColorPicker
                  color={ this.state.channelColor }
                  position="below"
                  display={ this.state.displayColorPicker }
                  onChange={ this.changeColor }
                  onChangeComplete={ this.handleColorPickerClose }
                  type="compact" positionCSS={popupPosition} />
              </div>
              <Input type="select" label="Package:" defaultValue={selectedPackage} placeholder="" groupClassName="arrow-icon" ref="packageChannel">
                <option value="" />
                {packages.map((packageItem, i) =>
                  <option value={packageItem.id} key={i}>{packageItem.version}</option>
                )}
              </Input>
              <div className="modal--footer">
                <Row>
                  <Col xs={8}>
                    <Alert bsStyle="danger" className={this.state.alertVisible ? "alert--visible" : ""}>
                      <strong>Error!</strong> Please check the form
                    </Alert>
                  </Col>
                  <Col xs={4}>
                    <Button bsStyle="default" className={"plainBtn" + btnStyle} disabled={this.state.isLoading} onClick={this.updateChannel}>{btnContent}</Button>
                  </Col>
                </Row>
              </div>
            </form>
          </div>
        </Modal.Body>
      </Modal>
    )
  }

}

export default ModalUpdate