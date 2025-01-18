// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CourseMarket.sol";

contract MockOracle is Ownable {
    CourseMarket public courseMarket;

    event CourseCompletionRequested(
        address indexed student,
        string web2CourseId,
        uint256 timestamp
    );

    constructor(address _courseMarket) Ownable(msg.sender) {
        courseMarket = CourseMarket(_courseMarket);
    }

    // 更新 CourseMarket 合约地址
    function setCourseMarket(address _courseMarket) external onlyOwner {
        require(_courseMarket != address(0), "Invalid address");
        courseMarket = CourseMarket(_courseMarket);
    }

    // 模拟课程完成通知
    function notifyCourseCompletion(
        address student,
        string memory web2CourseId
    ) external {
        emit CourseCompletionRequested(student, web2CourseId, block.timestamp);
        courseMarket.completeCourse(student, web2CourseId);
    }
} 