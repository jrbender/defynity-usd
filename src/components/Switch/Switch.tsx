import React from 'react';
import { ReactComponent as ArrowDualIcon } from '../../assets/images/Icons/double-arrow-svgrepo-com.svg';

interface Props {
    leftSide: string;
    rightSide: string;
}

const Switch = ({ leftSide, rightSide }: Props) => {
    return (
        <div className="switch-section">
            <div className="switch-section__text switch-section__text--left">{leftSide}</div>
            <div className="switch-section__icon">
                <ArrowDualIcon />
            </div>
            <div className="switch-section__text switch-section__text--right">{rightSide}</div>
        </div>
    );
};

export default Switch;
